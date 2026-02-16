# Task: gen-strv-caesar-6207 | Score: 100% | 2026-02-12T15:41:00.054745

def caesar_cipher(text, shift):
    result = ''
    for char in text:
        if 'a' <= char <= 'z':
            start = 'a'
        elif 'A' <= char <= 'Z':
            start = 'A'
        else:
            result += char
            continue
        shifted_char = chr((ord(char) - ord(start) + shift) % 26 + ord(start))
        result += shifted_char
    return result

text = input()
shift = int(input())
print(caesar_cipher(text, shift))