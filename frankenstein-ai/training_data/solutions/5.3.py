# Task: 5.3 | Score: 100% | 2026-02-10T15:39:15.577815

def solve():
  s = input()
  k = int(input())
  result = ''
  for char in s:
    if 'a' <= char <= 'z':
      result += chr(((ord(char) - ord('a') + k) % 26) + ord('a'))
    elif 'A' <= char <= 'Z':
      result += chr(((ord(char) - ord('A') + k) % 26) + ord('A'))
    else:
      result += char
  print(result)

solve()