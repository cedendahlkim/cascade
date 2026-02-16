# Task: gen-numtheory-digit_sum-4995 | Score: 100% | 2026-02-13T11:34:34.774361

n = int(input())
print(sum(int(d) for d in str(abs(n))))