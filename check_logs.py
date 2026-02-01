# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def check_logs():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        # PM2 status
        print("\n=== PM2 Status ===")
        stdin, stdout, stderr = client.exec_command('pm2 list', timeout=30)
        stdout.channel.recv_exit_status()
        output = stderr.read().decode('utf-8', errors='replace')
        print(output[-1500:] if output else "No output")
        
        # Error logs
        print("\n=== Error Log ===")
        stdin, stdout, stderr = client.exec_command('tail -30 /root/.pm2/logs/portal-error.log 2>/dev/null || echo "No log"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-2000:] if output else "No errors")
        
        # Out logs
        print("\n=== Out Log ===")
        stdin, stdout, stderr = client.exec_command('tail -15 /root/.pm2/logs/portal-out.log 2>/dev/null || echo "No log"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-1000:] if output else "No output")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    check_logs()
