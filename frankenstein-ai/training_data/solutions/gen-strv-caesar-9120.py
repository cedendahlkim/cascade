# Task: gen-strv-caesar-9120 | Score: 100% | 2026-02-12T16:29:54.074352

def caesar_cipher(text, shift):
    result = ''
    for char in text:
        if 'a' <= char <= 'z':
            start = ord('a')
            shifted_char = chr((ord(char) - start + shift) % 26 + start)
        elif 'A' <= char <= 'Z':
            start = ord('A')
            shifted_char = chr((ord(char) - start + shift) % 26 + start)
        else:
            shifted_char = char
        result += shifted_char
    return result

text = input()
shift = int(input())
print(caesar_cipher(text, shift))