# Task: gen-text-caesar-4738 | Score: 100% | 2026-02-17T19:58:04.718341

def caesar_decrypt(text, shift):
    result = ''
    for char in text:
        if 'a' <= char <= 'z':
            start = ord('a')
            shifted_char = chr((ord(char) - start - shift) % 26 + start)
            result += shifted_char
        else:
            result += char
    return result

text = input()
shift = int(input())

decrypted_text = caesar_decrypt(text, shift)
print(decrypted_text)