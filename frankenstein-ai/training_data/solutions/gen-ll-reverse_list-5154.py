# Task: gen-ll-reverse_list-5154 | Score: 100% | 2026-02-13T18:01:08.089242

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))