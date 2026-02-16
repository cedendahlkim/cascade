# Task: gen-ll-reverse_list-5197 | Score: 100% | 2026-02-15T12:02:54.372742

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))