import os

def check_status():
    local_audio_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"
    all_files = os.listdir(local_audio_dir)
    wav_files = [f for f in all_files if f.endswith('.wav')]
    mp3_files = {f for f in all_files if f.endswith('.mp3')}
    
    missing = []
    converted = []
    
    for wav in wav_files:
        mp3_name = wav.replace('.wav', '.mp3')
        if mp3_name not in mp3_files:
            missing.append(wav)
        else:
            converted.append((wav, mp3_name))
            
    print(f"Total WAV files: {len(wav_files)}")
    print(f"Already converted: {len(converted)}")
    print(f"Missing MP3s: {len(missing)}")
    
    if missing:
        print("\nMissing files:")
        for m in missing[:10]:
            print(f"- {m}")
        if len(missing) > 10:
            print("... and more")

if __name__ == "__main__":
    check_status()
