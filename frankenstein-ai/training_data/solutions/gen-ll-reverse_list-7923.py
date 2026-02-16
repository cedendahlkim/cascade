# Task: gen-ll-reverse_list-7923 | Score: 100% | 2026-02-14T13:11:48.194428

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))