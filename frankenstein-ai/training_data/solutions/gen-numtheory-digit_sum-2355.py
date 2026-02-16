# Task: gen-numtheory-digit_sum-2355 | Score: 100% | 2026-02-14T12:05:05.594682

n = int(input())
print(sum(int(d) for d in str(abs(n))))