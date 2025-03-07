import os
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox

# Function to process audio with Spleeter
def process_audio():
    file_path = filedialog.askopenfilename(filetypes=[("Audio Files", "*.mp3 *.wav")])
    if not file_path:
        return

    output_folder = "output_audio"
    os.makedirs(output_folder, exist_ok=True)

    try:
        # Run Spleeter's 2-stem model (vocals + accompaniment)
        command = f"spleeter separate -p spleeter:4stems -o {output_folder} \"{file_path}\""
        subprocess.run(command, shell=True, check=True)
        messagebox.showinfo("Success", f"Audio processing complete! Files saved in: {output_folder}")
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"Failed to process audio: {e}")

# GUI setup
root = tk.Tk()
root.title("Spleeter Audio Splitter")
root.geometry("300x150")
root.configure(bg="#f0f0f0")

btn_select = tk.Button(root, text="Select Audio File", command=process_audio, bg="#4CAF50", fg="white", padx=10, pady=5)
btn_select.pack(pady=20)

status_label = tk.Label(root, text="Choose a file to split", bg="#f0f0f0")
status_label.pack()

root.mainloop()
