# Task: gen-ll-reverse_list-5812 | Score: 100% | 2026-02-13T11:18:16.225664

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))