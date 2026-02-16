# Task: gen-ds-reverse_with_stack-5522 | Score: 100% | 2026-02-13T18:35:02.641848

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))