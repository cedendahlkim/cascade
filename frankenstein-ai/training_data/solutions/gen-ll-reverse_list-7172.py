# Task: gen-ll-reverse_list-7172 | Score: 100% | 2026-02-14T13:11:46.163849

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))