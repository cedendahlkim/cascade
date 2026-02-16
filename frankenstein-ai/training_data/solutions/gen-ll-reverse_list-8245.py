# Task: gen-ll-reverse_list-8245 | Score: 100% | 2026-02-13T18:34:02.072855

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))