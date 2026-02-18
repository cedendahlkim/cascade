# Task: gen-text-caesar-1949 | Score: 100% | 2026-02-17T19:57:53.580915

def caesar_decrypt(text, shift):
  result = ''
  for char in text:
    if 'a' <= char <= 'z':
      decrypted_char = chr((ord(char) - ord('a') - shift) % 26 + ord('a'))
    else:
      decrypted_char = char
    result += decrypted_char
  return result

encrypted_text = input()
shift_value = int(input())

decrypted_text = caesar_decrypt(encrypted_text, shift_value)
print(decrypted_text)