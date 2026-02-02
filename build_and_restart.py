# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def build_and_restart():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Pull latest changes
        print("\n>>> Pulling latest changes...")
        stdin, stdout, stderr = client.exec_command('cd /var/www/portal && git pull origin master', timeout=120)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-500:] if output else "Pulled")
        
        # Build client
        print("\n>>> Building client (npm run build)...")
        stdin, stdout, stderr = client.exec_command(
            'cd /var/www/portal/ScreenCreator && npm run build',
            timeout=300
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        print(output[-1000:] if output else "")
        if error and 'warning' not in error.lower():
            print(f"STDERR: {error[-500:]}")
        print(f"Build exit status: {exit_status}")
        
        # Check if dist folder exists
        print("\n>>> Checking dist folder...")
        stdin, stdout, stderr = client.exec_command('ls -la /var/www/portal/ScreenCreator/dist/ 2>/dev/null || echo "dist not found"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[:500])
        
        # Restart app
        print("\n>>> Restarting app...")
        stdin, stdout, stderr = client.exec_command('cd /var/www/portal/ScreenCreator && pm2 restart portal', timeout=60)
        stdout.channel.recv_exit_status()
        
        # Wait
        print("\n>>> Waiting 10 seconds...")
        time.sleep(10)
        
        # Check status
        print("\n>>> Checking port 5001...")
        stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 5001 || echo "Port not listening"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  {output}")
        
        # Test HTTP
        print("\n>>> Testing HTTP...")
        stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/ 2>/dev/null', timeout=10)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  HTTP Response: {output}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    build_and_restart()
