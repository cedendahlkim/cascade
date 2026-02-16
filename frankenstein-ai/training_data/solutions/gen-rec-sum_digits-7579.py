# Task: gen-rec-sum_digits-7579 | Score: 100% | 2026-02-13T09:12:21.930341

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)