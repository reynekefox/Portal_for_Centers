# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def run_dev_mode():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Update .env - remove NODE_ENV=production
        print("\n>>> Updating .env to development mode...")
        env_content = '''DATABASE_URL=postgresql://portal:portal123@localhost:5432/neurotrainer
PORT=5001
'''
        cmd = f"echo '{env_content}' > /var/www/portal/ScreenCreator/.env"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        stdout.channel.recv_exit_status()
        
        # Verify .env
        stdin, stdout, stderr = client.exec_command('cat /var/www/portal/ScreenCreator/.env', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  .env:\n{output}")
        
        # Restart PM2
        print("\n>>> Restarting PM2...")
        stdin, stdout, stderr = client.exec_command('pm2 restart portal', timeout=60)
        stdout.channel.recv_exit_status()
        
        # Wait longer for Vite to start
        print("\n>>> Waiting 15 seconds for Vite to start...")
        time.sleep(15)
        
        # Check port
        print("\n>>> Checking port 5001...")
        stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 5001 || echo "Port not listening"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  {output}")
        
        # Test HTTP
        print("\n>>> Testing HTTP...")
        stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/ 2>/dev/null', timeout=15)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  HTTP Response: {output}")
        
        # Check recent logs
        print("\n>>> Recent error logs:")
        stdin, stdout, stderr = client.exec_command('tail -10 /root/.pm2/logs/portal-error.log 2>/dev/null || echo "No errors"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-1500:] if output else "No errors")
        
        # Check output logs
        print("\n>>> Recent output logs:")
        stdin, stdout, stderr = client.exec_command('tail -15 /root/.pm2/logs/portal-out.log 2>/dev/null || echo "No output"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-1500:] if output else "No output")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    run_dev_mode()
