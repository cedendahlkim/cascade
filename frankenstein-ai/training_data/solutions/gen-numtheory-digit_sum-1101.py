# Task: gen-numtheory-digit_sum-1101 | Score: 100% | 2026-02-13T13:47:43.646344

n = int(input())
print(sum(int(d) for d in str(abs(n))))