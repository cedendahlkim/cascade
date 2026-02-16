# Task: gen-ll-reverse_list-2135 | Score: 100% | 2026-02-13T18:57:54.841775

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))