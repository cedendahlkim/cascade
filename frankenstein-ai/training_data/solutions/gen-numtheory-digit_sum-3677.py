# Task: gen-numtheory-digit_sum-3677 | Score: 100% | 2026-02-13T09:33:15.498362

n = int(input())
print(sum(int(d) for d in str(abs(n))))