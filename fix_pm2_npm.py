# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def fix_pm2_with_npm():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Stop all PM2 processes
        print("\n>>> Stopping all PM2 processes...")
        stdin, stdout, stderr = client.exec_command('pm2 delete all 2>/dev/null || true', timeout=30)
        stdout.channel.recv_exit_status()
        print("  Stopped")
        
        # Check .env file exists
        print("\n>>> Checking .env file...")
        stdin, stdout, stderr = client.exec_command('cat /var/www/portal/ScreenCreator/.env', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  .env content:\n{output}")
        
        # Start with npm run dev using PM2
        print("\n>>> Starting with 'pm2 start npm --name portal -- run dev'...")
        cmd = 'cd /var/www/portal/ScreenCreator && pm2 start npm --name "portal" -- run dev'
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        print(output[-800:] if output else error or "Started")
        
        # Save
        stdin, stdout, stderr = client.exec_command('pm2 save', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Wait
        print("\n>>> Waiting 8 seconds for app to start...")
        time.sleep(8)
        
        # Check port
        print("\n>>> Checking port 5001...")
        stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 5001 || echo "Port not listening"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  {output}")
        
        # Test HTTP
        print("\n>>> Testing HTTP...")
        stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/ 2>/dev/null || echo "Failed"', timeout=10)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  HTTP Response: {output}")
        
        # Check errors
        print("\n>>> Recent errors (last 5 lines):")
        stdin, stdout, stderr = client.exec_command('tail -5 /root/.pm2/logs/portal-error.log 2>/dev/null || echo "No errors"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output or "No errors")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    fix_pm2_with_npm()
