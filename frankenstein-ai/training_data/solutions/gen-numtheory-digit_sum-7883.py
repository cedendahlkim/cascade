# Task: gen-numtheory-digit_sum-7883 | Score: 100% | 2026-02-12T20:53:00.770772

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)