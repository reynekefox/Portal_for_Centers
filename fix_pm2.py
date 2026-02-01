# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def fix_pm2():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        # Create PM2 ecosystem config
        print("\n>>> Creating PM2 ecosystem.config.js...")
        ecosystem_config = '''module.exports = {
  apps: [{
    name: 'portal',
    script: 'npx',
    args: 'tsx server/index.ts',
    cwd: '/var/www/portal/ScreenCreator',
    env: {
      NODE_ENV: 'production',
      PORT: 5001,
      DATABASE_URL: 'postgresql://portal:portal123@localhost:5432/neurotrainer'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
'''
        cmd = f"cat > /var/www/portal/ScreenCreator/ecosystem.config.js << 'EOF'\n{ecosystem_config}\nEOF"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        stdout.channel.recv_exit_status()
        print("  ecosystem.config.js created")
        
        # Delete old PM2 process
        print("\n>>> Deleting old PM2 process...")
        stdin, stdout, stderr = client.exec_command('pm2 delete all 2>/dev/null || true', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Start with ecosystem
        print("\n>>> Starting with ecosystem.config.js...")
        stdin, stdout, stderr = client.exec_command(
            'cd /var/www/portal/ScreenCreator && pm2 start ecosystem.config.js',
            timeout=60
        )
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-800:] if output else "Started")
        
        # Save PM2 config
        print("\n>>> Saving PM2 config...")
        stdin, stdout, stderr = client.exec_command('pm2 save', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Wait for app to start
        print("\n>>> Waiting 5 seconds for app to start...")
        time.sleep(5)
        
        # Check status
        print("\n>>> Checking status...")
        stdin, stdout, stderr = client.exec_command('pm2 jlist', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        if '"status":"online"' in output:
            print("  Status: ONLINE!")
        else:
            print("  Status: May need more time")
            
        # Check port
        stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 5001 || echo "Port not listening"', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  Port 5001: {output}")
        
        # Test curl
        stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/ 2>/dev/null', timeout=10)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  HTTP Response: {output}")
        
        # Check recent logs
        print("\n>>> Recent logs:")
        stdin, stdout, stderr = client.exec_command('pm2 logs portal --lines 10 --nostream 2>&1', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(output[-1000:] if output else "No logs")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    fix_pm2()
