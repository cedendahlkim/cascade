# Task: gen-ll-reverse_list-6666 | Score: 100% | 2026-02-15T13:00:39.175557

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))