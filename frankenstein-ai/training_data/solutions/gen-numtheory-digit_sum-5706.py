# Task: gen-numtheory-digit_sum-5706 | Score: 100% | 2026-02-13T18:00:25.189605

n = int(input())
print(sum(int(d) for d in str(abs(n))))