# Task: 5.2 | Score: 100% | 2026-02-10T15:39:13.539256

def solve():
  s = input()
  stack = []
  mapping = {')': '(', ']': '[', '}': '{'}

  for char in s:
    if char in '([{':
      stack.append(char)
    elif char in ')]}':
      if not stack:
        print('invalid')
        return
      top = stack.pop()
      if mapping[char] != top:
        print('invalid')
        return
  
  if not stack:
    print('valid')
  else:
    print('invalid')

solve()