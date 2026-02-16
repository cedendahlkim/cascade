# Task: gen-rec-sum_digits-3059 | Score: 100% | 2026-02-13T09:22:33.292425

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)