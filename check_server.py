import paramiko
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def check_server():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        # Check PM2 status
        print("\n=== PM2 STATUS ===")
        _, stdout, stderr = client.exec_command('pm2 list')
        print(stdout.read().decode('utf-8', errors='replace'))
        
        # Check PM2 logs
        print("\n=== PM2 LOGS (last 30 lines) ===")
        _, stdout, stderr = client.exec_command('pm2 logs portal --lines 30 --nostream')
        print(stdout.read().decode('utf-8', errors='replace'))
        print(stderr.read().decode('utf-8', errors='replace'))
        
        # Check port
        print("\n=== PORT 5001 STATUS ===")
        _, stdout, _ = client.exec_command('netstat -tlnp | grep 5001')
        result = stdout.read().decode('utf-8', errors='replace')
        print(result if result else "PORT NOT LISTENING!")
        
        client.close()
        return True
    except Exception as e:
        print(f"Error: {e}")
        client.close()
        return False

if __name__ == "__main__":
    check_server()
