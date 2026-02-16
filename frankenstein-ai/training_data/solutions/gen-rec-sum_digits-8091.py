# Task: gen-rec-sum_digits-8091 | Score: 100% | 2026-02-13T19:48:17.658254

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)