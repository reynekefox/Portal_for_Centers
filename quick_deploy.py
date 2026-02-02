import paramiko
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def deploy():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        commands = [
            "cd /var/www/portal/ScreenCreator && git fetch origin master",
            "cd /var/www/portal/ScreenCreator && git reset --hard origin/master",
            "cd /var/www/portal/ScreenCreator && npm run build",
            "pm2 restart portal"
        ]
        
        for cmd in commands:
            print(f"\n>>> Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', 'ignore')
            err = stderr.read().decode('utf-8', 'ignore')
            if out: print(out)
            if err: print(f"STDERR: {err}")
            
            if exit_status != 0:
                print("Command failed!")
                return False
                
        print("\n=== DEPLOY SUCCESS ===")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
