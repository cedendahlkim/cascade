# Task: gen-numtheory-digit_sum-7074 | Score: 100% | 2026-02-12T12:08:05.669626

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)