# Task: gen-numtheory-count_digits-2706 | Score: 100% | 2026-02-12T17:29:37.075686

n = int(input())
count = 0
if n == 0:
  count = 1
else:
  while n != 0:
    n //= 10
    count += 1
print(count)