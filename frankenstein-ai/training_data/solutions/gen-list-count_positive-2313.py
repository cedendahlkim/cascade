# Task: gen-list-count_positive-2313 | Score: 100% | 2026-02-13T21:27:48.782286

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))