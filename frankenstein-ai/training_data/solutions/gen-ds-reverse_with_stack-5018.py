# Task: gen-ds-reverse_with_stack-5018 | Score: 100% | 2026-02-13T14:56:15.141689

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))