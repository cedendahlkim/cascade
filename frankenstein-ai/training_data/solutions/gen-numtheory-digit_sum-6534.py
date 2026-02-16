# Task: gen-numtheory-digit_sum-6534 | Score: 100% | 2026-02-12T12:48:06.339306

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)