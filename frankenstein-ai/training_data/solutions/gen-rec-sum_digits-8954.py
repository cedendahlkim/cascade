# Task: gen-rec-sum_digits-8954 | Score: 100% | 2026-02-13T19:48:26.012363

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)