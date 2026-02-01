# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

COMMANDS = [
    # Install nginx
    'apt install -y nginx',
    # Install certbot for SSL
    'apt install -y certbot python3-certbot-nginx',
    # Enable nginx
    'systemctl enable nginx',
    'systemctl start nginx',
    # Check status
    'systemctl status nginx --no-pager',
]

def run_ssh_commands():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        for cmd in COMMANDS:
            print(f"\n>>> {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='replace')
            if output:
                print(output[-800:] if len(output) > 800 else output)
            print(f"Exit: {exit_status}")
                
        print("\n=== Nginx installed! ===")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    run_ssh_commands()
