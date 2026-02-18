# Task: gen-rec-sum_digits-8136 | Score: 100% | 2026-02-17T19:57:42.552371

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)