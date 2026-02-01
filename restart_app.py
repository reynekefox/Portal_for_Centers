# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def restart_app():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        # Stop current PM2 process
        print("\n>>> Stopping current PM2 process")
        stdin, stdout, stderr = client.exec_command('pm2 delete portal 2>/dev/null || true', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Install tsx globally
        print("\n>>> Installing tsx globally")
        stdin, stdout, stderr = client.exec_command('npm install -g tsx', timeout=120)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-500:] if output else "Done")
        
        # Start with PM2 using npx tsx
        print("\n>>> Starting app with PM2")
        stdin, stdout, stderr = client.exec_command(
            'cd /var/www/portal/ScreenCreator && pm2 start "npx tsx server/index.ts" --name portal',
            timeout=60
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        print(output or error or "Started")
        
        # Save PM2 config
        print("\n>>> Saving PM2 config")
        stdin, stdout, stderr = client.exec_command('pm2 save', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Check status
        print("\n>>> Checking status...")
        import time
        time.sleep(3)
        
        stdin, stdout, stderr = client.exec_command('pm2 jlist', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        if '"status":"online"' in output:
            print("Status: ONLINE!")
        else:
            print("Status: May need more time to start")
            
        # Check port
        stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 5001 || echo "Port not listening yet"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"Port 5001: {output}")
        
        print("\n=== App restarted! ===")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    restart_app()
