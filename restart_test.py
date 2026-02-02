# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def restart_and_test():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Restart PM2
        print("\n>>> Restarting PM2...")
        stdin, stdout, stderr = client.exec_command('pm2 restart portal', timeout=60)
        stdout.channel.recv_exit_status()
        print("  Restarted")
        
        # Wait for Vite to start
        print("\n>>> Waiting 20 seconds for Vite to initialize...")
        time.sleep(20)
        
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
        
        # Check PM2 status
        print("\n>>> PM2 Status:")
        stdin, stdout, stderr = client.exec_command('pm2 list', timeout=30)
        stdout.channel.recv_exit_status()
        output = stderr.read().decode('utf-8', errors='replace')
        # Extract status line
        for line in output.split('\n'):
            if 'portal' in line or 'status' in line.lower():
                print(f"  {line}")
                
        # Recent output
        print("\n>>> Recent output logs:")
        stdin, stdout, stderr = client.exec_command('tail -5 /root/.pm2/logs/portal-out.log 2>/dev/null', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-500:] if output else "No output")
        
        # Recent errors
        print("\n>>> Recent errors:")
        stdin, stdout, stderr = client.exec_command('tail -5 /root/.pm2/logs/portal-error.log 2>/dev/null', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-500:] if output else "No errors")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    restart_and_test()
