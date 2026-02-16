# Task: gen-numtheory-digit_sum-5884 | Score: 100% | 2026-02-13T18:21:05.491403

n = int(input())
print(sum(int(d) for d in str(abs(n))))