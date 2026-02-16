# Task: gen-ll-reverse_list-1560 | Score: 100% | 2026-02-13T18:00:37.264070

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))