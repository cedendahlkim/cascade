# Task: gen-rec-sum_digits-2942 | Score: 100% | 2026-02-14T12:37:29.082931

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)