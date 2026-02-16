# Task: gen-list-count_positive-6029 | Score: 100% | 2026-02-13T20:33:06.096622

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))