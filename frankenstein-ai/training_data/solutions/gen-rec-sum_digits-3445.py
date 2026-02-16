# Task: gen-rec-sum_digits-3445 | Score: 100% | 2026-02-15T09:18:03.408493

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)