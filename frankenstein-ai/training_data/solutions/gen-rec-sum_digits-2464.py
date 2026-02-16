# Task: gen-rec-sum_digits-2464 | Score: 100% | 2026-02-14T13:11:51.872445

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)