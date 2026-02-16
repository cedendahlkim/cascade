# Task: gen-rec-sum_digits-8581 | Score: 100% | 2026-02-13T18:46:05.391911

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)