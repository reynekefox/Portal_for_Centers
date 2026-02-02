import paramiko
import os
import io
import sys
import time

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def convert_chunked():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    local_audio_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"
    # Identify files that need conversion (wav files without a corresponding mp3)
    # Actually, we might want to re-convert all wavs to be safe/consistent, or just missing ones.
    # Let's do all .wav files found.
    
    all_files = os.listdir(local_audio_dir)
    wav_files = [f for f in all_files if f.endswith('.wav')]
    mp3_files = {f for f in all_files if f.endswith('.mp3')}
    
    # Filter: Only convert if mp3 doesn't exist? Or overwrite? 
    # User said "Convert to mp3", implying they want the wavs converted. 
    # Let's check if the mp3 counterpart exists.
    
    to_convert = []
    for wav in wav_files:
        mp3_name = wav.replace('.wav', '.mp3')
        if mp3_name not in mp3_files:
            to_convert.append(wav)
        else:
            # Maybe checking file size? If mp3 is 0 bytes?
            # For now, let's just convert meaningful ones.
            # If user wants to FORCE, we can. But to save time, let's skip existing valid mp3s.
            pass
            
    # Actually, the user asked to convert because the wavs are large.
    # If I already have mp3s (from Ricoz), I don't need to convert corresponding wavs if they don't exist?
    # Wait, the wavs I extracted from ESC-50 (crow, pig, etc) DO NOT have mp3s yet.
    # So checking for missing mp3 is the perfect filter.
    
    print(f"Found {len(wav_files)} .wav files.")
    print(f"Need to convert {len(to_convert)} files (skipping existing .mp3s).")
    
    if not to_convert:
        print("Nothing to convert!")
        return

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        sftp = client.open_sftp()
        remote_temp_dir = "/root/temp_audio_chunked"
        
        # Setup remote env
        client.exec_command(f"mkdir -p {remote_temp_dir}")
        # Ensure ffmpeg
        print("Ensuring ffmpeg is installed...")
        stdin, stdout, stderr = client.exec_command("which ffmpeg || (apt-get update && apt-get install -y ffmpeg)")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
             print("Error installing ffmpeg")
             # print(stderr.read()) # Debug
        
        print("Starting conversion loop...")
        
        for idx, wav_file in enumerate(to_convert):
            local_wav_path = os.path.join(local_audio_dir, wav_file)
            remote_wav_path = f"{remote_temp_dir}/{wav_file}"
            mp3_file = wav_file.replace('.wav', '.mp3')
            remote_mp3_path = f"{remote_temp_dir}/{mp3_file}"
            local_mp3_path = os.path.join(local_audio_dir, mp3_file)
            
            print(f"[{idx+1}/{len(to_convert)}] Processing {wav_file}...", end='', flush=True)
            
            try:
                # 1. Upload
                sftp.put(local_wav_path, remote_wav_path)
                
                # 2. Convert
                cmd = f"ffmpeg -y -i {remote_wav_path} -acodec libmp3lame -q:a 2 {remote_mp3_path}"
                _, stdout, _ = client.exec_command(cmd)
                if stdout.channel.recv_exit_status() != 0:
                     print(" [Conversion Failed]", flush=True)
                     continue
                
                # 3. Download
                sftp.get(remote_mp3_path, local_mp3_path)
                
                # 4. Clean remote
                sftp.remove(remote_wav_path)
                sftp.remove(remote_mp3_path)
                
                print(" [Done]", flush=True)
                
            except Exception as e:
                print(f" [Error: {e}]", flush=True)
                
        print("\nAll done!")
        sftp.close()
        client.close()
        
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    convert_chunked()
