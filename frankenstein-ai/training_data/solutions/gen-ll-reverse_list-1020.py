# Task: gen-ll-reverse_list-1020 | Score: 100% | 2026-02-13T18:40:49.168900

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))