# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def check_error():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Get full error
        print("\n>>> Full error log (last 30 lines):")
        stdin, stdout, stderr = client.exec_command('tail -30 /root/.pm2/logs/portal-error.log 2>/dev/null', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output)
        
        # Check node_modules
        print("\n>>> Checking if vite is installed:")
        stdin, stdout, stderr = client.exec_command('ls -la /var/www/portal/ScreenCreator/node_modules/vite 2>/dev/null || echo "vite not found"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[:500])
        
        # Install all dependencies (not just production)
        print("\n>>> Running npm install (all dependencies)...")
        stdin, stdout, stderr = client.exec_command(
            'cd /var/www/portal/ScreenCreator && npm install 2>&1',
            timeout=300
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-1000:] if len(output) > 1000 else output)
        print(f"Exit status: {exit_status}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    check_error()
