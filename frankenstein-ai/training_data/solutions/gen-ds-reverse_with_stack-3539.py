# Task: gen-ds-reverse_with_stack-3539 | Score: 100% | 2026-02-13T13:10:30.415462

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))